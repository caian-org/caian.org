.DEFAULT_GOAL := build
.PHONY: clean clean-build

J = bundle exec jekyll
export JEKYLL_ENV = production

init:
	@mkdir -p vendor
	@bundle install --path vendor
	@npm install
	@npm run add-hooks

update:
	@bundle update
	@npm run bump:all
	@npm install

clean:
	@$(J) clean
	@rm -rf .bundle .pug-cache node_modules public vendor

# Create the static and store it in public/
build:
	@$(J) build

# Create the static and store it in public/
build-dev:
	@$(J) build --drafts

serve:
	@$(J) serve --drafts
