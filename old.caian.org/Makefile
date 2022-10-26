.DEFAULT_GOAL := build

PWD := $(subst .,-,$(shell basename $(shell pwd)))


build:
	npm run build

serve:
	npm run serve

deploy:
	wrangler pages publish --project-name $(PWD) public
