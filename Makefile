.DEFAULT_GOAL := build
.PHONY: clean clean-build

clean:
	bundle exec jekyll clean

build:  # Create the static and store it in site/
	bundle exec jekyll build

build-clean: clean build

build-dev:  # Create the static and store it in site/
	bundle exec jekyll build --drafts

install:
	mkdir -p vendor
	bundle install --path vendor

serve: clean
	bundle exec jekyll serve --drafts
