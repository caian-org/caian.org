.DEFAULT_GOAL := build
.PHONY: clean clean-build

J = bundle exec jekyll
export JEKYLL_ENV = production

# ...

install:
	@mkdir -p vendor
	@bundle install --path vendor
	@npm install

init: install
	@npm run add-hooks

update:
	@bundle update
	@npm run bump:all
	@npm install

clean:
	@$(J) clean
	@rm -rf .bundle .pug-cache node_modules public vendor report

# ...

precompile:
	@cd content \
		&& rm -rf files  \
		&& mkdir files \
		&& touch files/.git-keep
	@npm run autoindex

build: precompile
	@$(J) build --trace

serve: precompile
	@$(J) serve --drafts --host=0.0.0.0

deploy:
	@npm install --global pug
	@$(MAKE) install
	@$(MAKE) build
