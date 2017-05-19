```
$ curl -vvv -H "Accept: application/json" -X GET https://ajhlhy4647.execute-api.ap-northeast-1.amazonaws.com/dev/training-sally/pic.png -o my.png

$ curl -vvv -H "Accept: application/json" -X GET https://ajhlhy4647.execute-api.ap-northeast-1.amazonaws.com/dev/training-sally/doc.pdf -o data/doc.pdf
```

```
$ curl -v -H "Content-Type:application/octet-stream" -X PUT --data-binary "@./data/doc2.pdf" https://ajhlhy4647.execute-api.ap-northeast-1.amazonaws.com/dev/training-sally
```

```
$ curl -v -H "Content-Type:application/octet-stream" -X POST --data-binary "@./data/doc2.pdf" https://z4bf9rzv53.execute-api.ap-northeast-1.amazonaws.com/dev/training-sally/doc2.pdf
```