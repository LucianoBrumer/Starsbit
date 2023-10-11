const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const uglifyjs = require("uglify-js")
const htmlMinifier = require('html-minifier')
const cleancss = require('clean-css')

const customArgs = ['src', 'dist']

const args = {}
customArgs.forEach(arg => args[arg] = null)
const avalibleArgs = {}
customArgs.forEach(arg => avalibleArgs[arg] = [])
Object.keys(avalibleArgs).forEach(arg => {
	avalibleArgs[arg].push(`--${arg}`)
	avalibleArgs[arg].push(`-${arg.split('')[0]}`)
})
const processArgv = process.argv.slice(2)
processArgv.forEach((val, index) => {
	Object.entries(avalibleArgs).forEach(([key, value]) => {
		if(value.includes(val)) args[key] = processArgv[index+1]
	})
})

const srcPath = path.join(__dirname, args.src)
const publicPath = path.join(__dirname, args.dist)

function copyFilesAndDirectories(src, dest) {
    if (fs.statSync(src).isDirectory()) {
        fse.ensureDirSync(dest)

        const items = fs.readdirSync(src);

        items.forEach(item => {
            const srcItemPath = path.join(src, item);
            const destItemPath = path.join(dest, item);

            copyFilesAndDirectories(srcItemPath, destItemPath)
        });
    } else {
		const srcExtension = path.extname(src)

		if(srcExtension == '.js') {
			const srcContent = fs.readFileSync(src, 'utf8')
			const minifiedSrcContent = uglifyjs.minify(srcContent)
			fs.writeFileSync(dest, minifiedSrcContent.code)
		}else if(srcExtension == '.html'){
			const srcContent = fs.readFileSync(src, 'utf8')
			const minifiedSrcContent = htmlMinifier.minify(srcContent, {
				removeAttributeQuotes: true
			})
			fs.writeFileSync(dest, minifiedSrcContent)
		}else if(srcExtension == '.css'){
			const srcContent = fs.readFileSync(src, 'utf8')
			const minifiedSrcContent = new cleancss({ compatibility: '*' }).minify(srcContent);
			fs.writeFileSync(dest, minifiedSrcContent)
		}else{
			fse.copyFileSync(src, dest)
		}
	}
}

copyFilesAndDirectories(srcPath, publicPath);