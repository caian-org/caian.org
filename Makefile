.DEFAULT_GOAL := build
.PHONY: clean clean-build

J = bundle exec jekyll

init:
	@mkdir -p vendor
	@bundle install --path vendor
	@npm install
	@npx husky install

update:
	@bundle update
	@npm run bump:all
	@npm install

clean:
	@$(J) clean

# Create the static and store it in site/
build:
	@$(J) build

# Create the static and store it in site/
build-dev:
	@$(J) build --drafts

serve: clean
	@$(J) serve --drafts
