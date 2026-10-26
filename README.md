# 王子杨 · 个人作品集

静态个人作品集网站，部署于 GitHub Pages：**https://youyou475.github.io/**

## 页面结构

| 文件 | 内容 |
| --- | --- |
| `index.html` | 首页：Hero（内容创作 / 新媒体运营）、作品全集（分类上栏 + 子轨道）、关于我、教育/研究、联系入口 |
| `experience.html` | 实习经历时间线 + 校园/项目经历 |
| `contact.html` | 联系方式（三面切换 + 叠卡交互） |
| `style.css` | 全站样式（bazil 设计系统） |
| `app.js` | 交互脚本（时钟、命令面板、双语切换、灯箱、视频 hover 播放等） |
| `assets/` | 图片（`img/`）、视频（`vid/`）、文件（`files/`） |

## 说明

- 纯静态站点，无构建依赖，`index.html` 可直接打开或任意静态服务器托管。
- 中英双语：默认跟随系统/浏览器语言（`navigator.languages`），可手动切换并记忆。
- 支持深浅色主题，选择记忆于 `localStorage`。
- 本地生成脚本 `build_site.py`（三页由数据驱动生成）仅用于开发，不参与线上运行。

## 本地预览

```bash
cd site
python3 -m http.server 8123 --bind 127.0.0.1
# 打开 http://127.0.0.1:8123/
```

## 更新部署

修改 `site/` 目录下的源文件后，将站点文件推送至本仓库 `master` 分支根目录即可自动发布：

```bash
git clone https://github.com/youyou475/youyou475.github.io.git
# 用 site/ 下的 index.html experience.html contact.html style.css app.js assets 覆盖仓库根目录
git add -A && git commit -m "Update site" && git push origin master
```
