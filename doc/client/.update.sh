#!/bin/bash
rm *
cp ~/Projects/OSjsNew/doc/generated/* .
git add .
git commit -a -m "Updated docs"
