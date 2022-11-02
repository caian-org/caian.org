.DEFAULT_GOAL := build

PWD := $(subst .,-,$(shell basename $(shell pwd)))


build:
	hugo

serve:
	hugo server

deploy:
	wrangler pages publish --project-name $(PWD) public
