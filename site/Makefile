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

# ...

clean:
	@$(J) clean
	@rm -rf .bundle .pug-cache node_modules public vendor

serve:
	@$(J) serve --drafts

# Create the static and store it in public/
build:
	@$(J) build --trace

# Create the static and store it in public/
build-dev:
	@$(J) build --trace --drafts

# ...

deploy:
	@sudo npm install --global pug
	@$(MAKE) install-prod
	@$(MAKE) build
