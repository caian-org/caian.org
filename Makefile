.DEFAULT_GOAL := build


build:
	hugo

serve:
	hugo server

deploy:
	wrangler pages publish --project-name caian-org public
