package main

import (
	"bytes"
	"context"
	"flag"
	"fmt"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type object struct {
	Key          string
	Size         int64
	LastModified time.Time
}

type entry struct {
	Name         string
	URL          string
	Size         string
	LastModified string
}

type dirLevel struct {
	DirLevel        string
	ParentDirectory string
	IsRoot          bool
	Directories     []entry
	Files           []entry
}

type options struct {
	Bucket string
	Region string
	OutDir string
	Clean  bool
}

func main() {
	var opts options
	flag.StringVar(&opts.Bucket, "bucket", "caian-org", "S3 bucket name")
	flag.StringVar(&opts.Region, "region", "us-east-1", "AWS region")
	flag.StringVar(&opts.OutDir, "out", "content/files", "output directory relative to repo root")
	flag.BoolVar(&opts.Clean, "clean", true, "remove existing output before generation")
	flag.Parse()

	root, err := findRepoRoot()
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}

	outDir := filepath.Join(root, filepath.FromSlash(opts.OutDir))
	if opts.Clean {
		if err := os.RemoveAll(outDir); err != nil {
			fmt.Fprintf(os.Stderr, "error removing output: %v\n", err)
			os.Exit(1)
		}
	}

	if err := os.MkdirAll(outDir, 0o755); err != nil {
		fmt.Fprintf(os.Stderr, "error creating output: %v\n", err)
		os.Exit(1)
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(opts.Region))
	if err != nil {
		fmt.Fprintf(os.Stderr, "error loading AWS config: %v\n", err)
		os.Exit(1)
	}

	client := s3.NewFromConfig(cfg)
	objects, err := listObjects(ctx, client, opts.Bucket)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error listing objects: %v\n", err)
		os.Exit(1)
	}

	levels := buildStructure(opts.Bucket, objects)
	if err := writeLevels(outDir, levels); err != nil {
		fmt.Fprintf(os.Stderr, "error writing output: %v\n", err)
		os.Exit(1)
	}
}

func findRepoRoot() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	dir := cwd
	for {
		candidate := filepath.Join(dir, "hugo.toml")
		if _, err := os.Stat(candidate); err == nil {
			return dir, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	return "", fmt.Errorf("could not find repo root (missing hugo.toml)")
}

func listObjects(ctx context.Context, client *s3.Client, bucket string) ([]object, error) {
	var out []object
	p := s3.NewListObjectsV2Paginator(client, &s3.ListObjectsV2Input{Bucket: &bucket})

	for p.HasMorePages() {
		page, err := p.NextPage(ctx)
		if err != nil {
			return nil, err
		}

		for _, obj := range page.Contents {
			if obj.Key == nil {
				continue
			}

			size := int64(0)
			if obj.Size != nil {
				size = *obj.Size
			}

			last := time.Now()
			if obj.LastModified != nil {
				last = *obj.LastModified
			}

			out = append(out, object{
				Key:          *obj.Key,
				Size:         size,
				LastModified: last,
			})
		}
	}

	return out, nil
}

func buildStructure(bucket string, objects []object) map[string]*dirLevel {
	dirs := map[string]struct{}{}
	levels := map[string]*dirLevel{}

	levels[""] = &dirLevel{
		DirLevel:        "/",
		ParentDirectory: "/",
		IsRoot:          true,
	}

	for _, obj := range objects {
		if obj.Key == "" {
			continue
		}

		d := path.Dir(obj.Key)
		if d != "." {
			dirs[d] = struct{}{}
		}
	}

	dirList := make([]string, 0, len(dirs))
	for d := range dirs {
		dirList = append(dirList, d)
	}
	sort.Strings(dirList)

	for _, d := range dirList {
		levels[d] = &dirLevel{
			DirLevel:        "/" + d,
			ParentDirectory: parentURL(d),
			IsRoot:          false,
		}
	}

	for _, d := range dirList {
		parent := path.Dir(d)
		if parent == "." {
			parent = ""
		}

		if levels[parent] == nil {
			levels[parent] = &dirLevel{
				DirLevel:        "/" + parent,
				ParentDirectory: parentURL(parent),
				IsRoot:          parent == "",
			}
		}

		levels[parent].Directories = append(levels[parent].Directories, dirEntry(d))
	}

	for _, obj := range objects {
		if obj.Key == "" || strings.HasSuffix(obj.Key, "/") {
			continue
		}

		parent := path.Dir(obj.Key)
		if parent == "." {
			parent = ""
		}

		if levels[parent] == nil {
			levels[parent] = &dirLevel{
				DirLevel:        "/" + parent,
				ParentDirectory: parentURL(parent),
				IsRoot:          parent == "",
			}
		}

		levels[parent].Files = append(levels[parent].Files, fileEntry(bucket, obj))
	}

	for _, lvl := range levels {
		sort.Slice(lvl.Directories, func(i, j int) bool { return lvl.Directories[i].Name < lvl.Directories[j].Name })
		sort.Slice(lvl.Files, func(i, j int) bool { return lvl.Files[i].Name < lvl.Files[j].Name })
	}

	return levels
}

func writeLevels(outDir string, levels map[string]*dirLevel) error {
	keys := make([]string, 0, len(levels))
	for key := range levels {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	for _, key := range keys {
		lvl := levels[key]
		title := "files"
		if key != "" {
			title = path.Base(key)
		}

		pageDir := outDir
		if key != "" {
			pageDir = filepath.Join(outDir, filepath.FromSlash(key))
		}

		if err := os.MkdirAll(pageDir, 0o755); err != nil {
			return err
		}

		pagePath := filepath.Join(pageDir, "_index.md")
		content := renderFrontMatter(title, lvl)

		if err := os.WriteFile(pagePath, content, 0o644); err != nil {
			return err
		}
	}

	return nil
}

func renderFrontMatter(title string, lvl *dirLevel) []byte {
	buf := &bytes.Buffer{}
	buf.WriteString("---\n")
	buf.WriteString(fmt.Sprintf("title: %s\n", yamlQuote(title)))
	buf.WriteString("type: \"files\"\n")
	buf.WriteString(fmt.Sprintf("dir_level: %s\n", yamlQuote(lvl.DirLevel)))
	buf.WriteString(fmt.Sprintf("parent_directory: %s\n", yamlQuote(lvl.ParentDirectory)))
	buf.WriteString(fmt.Sprintf("is_root: %v\n", lvl.IsRoot))

	buf.WriteString("directories:\n")
	if len(lvl.Directories) == 0 {
		buf.WriteString("  []\n")
	} else {
		for _, d := range lvl.Directories {
			writeEntry(buf, d)
		}
	}

	buf.WriteString("files:\n")
	if len(lvl.Files) == 0 {
		buf.WriteString("  []\n")
	} else {
		for _, f := range lvl.Files {
			writeEntry(buf, f)
		}
	}

	buf.WriteString("---\n")
	return buf.Bytes()
}

func writeEntry(buf *bytes.Buffer, e entry) {
	buf.WriteString(fmt.Sprintf("  - name: %s\n", yamlQuote(e.Name)))
	buf.WriteString(fmt.Sprintf("    url: %s\n", yamlQuote(e.URL)))
	buf.WriteString(fmt.Sprintf("    size: %s\n", yamlQuote(e.Size)))
	buf.WriteString(fmt.Sprintf("    last_modified: %s\n", yamlQuote(e.LastModified)))
}

func yamlQuote(s string) string {
	escaped := strings.ReplaceAll(s, "\\", "\\\\")
	escaped = strings.ReplaceAll(escaped, "\"", "\\\"")
	return fmt.Sprintf("\"%s\"", escaped)
}

func dirEntry(dir string) entry {
	return entry{
		Name:         path.Base(dir),
		URL:          "/files/" + safeURIEncode(dir),
		Size:         "-",
		LastModified: "-",
	}
}

func fileEntry(bucket string, obj object) entry {
	return entry{
		Name:         path.Base(obj.Key),
		URL:          fmt.Sprintf("https://%s.s3.amazonaws.com/%s", bucket, safeURIEncode(obj.Key)),
		Size:         formatSize(obj.Size),
		LastModified: formatTime(obj.LastModified),
	}
}

func parentURL(dir string) string {
	if dir == "" {
		return "/"
	}

	parent := path.Dir(dir)
	if parent == "." || parent == "" {
		return "/files"
	}

	return "/files/" + safeURIEncode(parent)
}

func formatSize(bytes int64) string {
	if bytes <= 0 {
		return "0 Bytes"
	}

	units := []string{"Bytes", "KB", "MB", "GB", "TB", "PB", "EB"}
	value := float64(bytes)
	i := 0
	for value >= 1024 && i < len(units)-1 {
		value /= 1024
		i++
	}

	if i == 0 {
		return fmt.Sprintf("%d %s", bytes, units[i])
	}

	return fmt.Sprintf("%.2f %s", value, units[i])
}

func formatTime(t time.Time) string {
	loc, err := time.LoadLocation("America/Sao_Paulo")
	if err != nil {
		loc = time.UTC
	}

	return t.In(loc).Format("January 02, 2006 03:04 PM")
}

func safeURIEncode(resource string) string {
	parts := strings.Split(resource, "/")
	encoded := make([]string, 0, len(parts))

	for _, part := range parts {
		if part == "" {
			continue
		}
		encoded = append(encoded, url.PathEscape(part))
	}

	return strings.Join(encoded, "/")
}
