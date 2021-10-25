.DEFAULT_GOAL := build
.PHONY: clean clean-build

J = bundle exec jekyll
export JEKYLL_ENV = production

install-prod:
	@mkdir -p vendor
	@bundle install --path vendor

install-dev:
	@npm install
	@npm run add-hooks

install: install-prod install-dev

update:
	@bundle update
	@npm run bump:all
	@npm install

clean:
	@$(J) clean
	@rm -rf .bundle .pug-cache node_modules public vendor

# ...

precompile:
	@cd content && rm -rf files && git checkout -- files
	@npm run autoindex

build: precompile
	@$(J) build --trace

serve: precompile
	@$(J) serve --drafts

deploy:
	@npm install --global pug
	@$(MAKE) install
	@$(MAKE) build
