#!/bin/bash

nohup broadwayd --address 0.0.0.0 :5 &
nodejs spawner-service.js
