const path = require('path')
const fs = require('fs')
const isDev = (process.env.NODE_ENV === 'development')
const cwd = (isDev ? process.cwd() : process.argv[0].replace('rdp_connect.exe', ''))
const logfile = path.join(cwd, '/main.log')

if (fs.existsSync(logfile)) fs.unlinkSync(logfile)

module.exports = async (text, noConsole = false) => {
	if (!noConsole) console.log(text)
	try {
		if (!fs.existsSync(logfile)) fs.writeFileSync(logfile, '')

		fs.appendFileSync(logfile, text+'\n')
	} catch (err) {
		console.error(err)
	}
}
