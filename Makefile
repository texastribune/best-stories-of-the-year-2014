download_spreadsheet:
	node ./tools/download_xlsx.js
	node ./tools/build_data_json.js

deploy:
	aws s3 sync --delete --acl public-read build s3://graphics.texastribune.org/dailies/best-stories-of-the-year-2014/
