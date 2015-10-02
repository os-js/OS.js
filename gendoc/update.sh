node generate.js
rm output/client/*
node generate-client.js
node generate-sitemap.js
mv output/sitemap.xml ../sitemap.xml
