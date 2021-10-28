.DEFAULT_GOAL := watch
.PHONY: clean autoindex

J = bundle exec jekyll
N = npm run

export JEKYLL_ENV = production

# ...

watch:
	npx nodemon

# ...

install:
	@mkdir -p vendor
	@bundle install --path vendor
	@npm install

init: install
	@$(N) add-hooks

update:
	@bundle update
	@$(N) bump:all
	@npm install

uninstall:
	@rm -rf .bundle node_modules vendor

clean-cache:
	@rm -rf .pug-cache public content/.jekyll-cache content/.jekyll-metadata

clean: uninstall clean-cache
	@rm -rf report

# ...

jekyll:
	@$(J) build --trace

serve: clean-cache
	@$(MAKE) autoindex
	@$(J) serve --drafts --host=0.0.0.0

autoindex:
	@cd content \
		&& rm -rf files \
		&& mkdir files
	@npx ts-node autoindex

deploy:
	@npm install --global pug
	@$(MAKE) install
	@$(MAKE) jekyll
	@$(MAKE) autoindex
