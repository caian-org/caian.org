.DEFAULT_GOAL := build
.PHONY: clean clean-build

clean: clean-build

clean-build:
	bundle exec jekyll clean

build:  # Create the static and store it in _site/
	bundle exec jekyll build

build-dev:  # Create the static and store it in _site/
	bundle exec jekyll build --drafts

install:
	mkdir -p vendor
	bundle install --path vendor

serve: clean
	bundle exec jekyll serve --drafts
