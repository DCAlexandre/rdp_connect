const { exec, spawn } = require('child_process')
// https://www.npmjs.com/package/commander

module.exports = {
	runCmd: (cmd, options = {}) => {
		return new Promise((resolve, reject) => {
			exec(cmd, options, (err, stdout, stderr) => {
				if (err) {
					err.message = unescape(err.message.replace(/\u0000/g,''))
				}
				if (stdout) stdout = unescape(stdout.replace(/\u0000/g,''))
				if (stderr) stderr = unescape(stderr.replace(/\u0000/g,''))
				if (err) return reject(err)

				resolve(stdout ? stdout : stderr)
			})
		})
	},
	spawn: (cmd, args = [], options = {}) => {
		return new Promise(async (resolve, reject) => {
			let message = ''
			let proc = spawn(cmd, args, options)

			proc.stdout.on('data', (data) => {
				message += ((message.length ? '\n' : '')+data)
				// console.log(`stdout: ${data}`)
			})

			proc.stderr.on('data', (data) => {
				message += ((message.length ? '\n' : '')+data)
				// console.error(`stderr: ${data}`)
			})

			proc.on('error', (err) => {
				reject(err)
				// reject(`child process exited with error ${err.message}`)
			})

			proc.on('close', (code) => {
				resolve(message)
				// resolve(`child process exited with code ${code}`)
			})

			if (options.detached) {
				proc.unref()
				resolve()
			}
		})
	}
}
