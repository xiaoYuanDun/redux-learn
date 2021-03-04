## 在 GitHub 创建仓库时没有添加 README 文件，先创建 README.md 文件

touch README.md

## Git 初始化

git init
说明：当前目录执行 git 初始化，在当前目录中添加一个.git 文件夹来存储一些 git 数据

## 前端项目初始化

yarn init

## 添加所有文件到暂存区

git add \*

## 将暂存区内容提交到本地仓库

git commit -m "项目本地仓库上传"

## 连接远程仓库(SSH 和 HTTPS 方式都行)

git remote add origin git@github.com:rangdandanfei/git-use-demo.git

## 提交到远程仓库

git push -u origin master
说明：
git push 将当前分支推送至远程同名分支
git push origin [branch-name] 推送本地某分支至远程某分支
git push -u origin [branch-name] 推送本地某分支至远程某分支，并跟踪

首次提交需要提交秘钥至 github
cat ~/.ssh/id_rsa.pub  
粘贴到 github/settings/keys 中对应的 key 即可
