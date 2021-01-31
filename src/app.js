const path = require('path')
const fs = require('fs')
const buildRdpFile = require('./rdp_file')
// const cmd = require('@aexae/js_tools').cmd
const cmd = require('./cmd.js')
const isDev = (process.env.NODE_ENV === 'development')
const cwd = (isDev ? process.cwd() : process.argv[0].replace('rdp_connect.exe', ''))

module.exports = class App {
	// Initialisation
	constructor(args = {}) {
		this.args = args
		this.onEvent = null
		this.installerPath = (isDev ? path.join(cwd, '/dist/rdp_connect.exe') : process.argv[0])
		this.exePath = ((isDev && !this.args.debug) ? path.join(cwd, '/dist') : path.join(process.env.programData, '/rdp_connect'))
		this.exeFile = path.join(this.exePath, '/rdp_connect.exe')
		this.vbsFile = path.join(this.exePath, '/rdp_connect.vbs')
		this.regFile = path.join(this.exePath, '/rdp_connect.reg')
		this.rdpFile = ''
	}

	start() {
		return new Promise(async (resolve, reject) => {
			let result = { success: true }

			if (!fs.existsSync(this.vbsFile)) {
				await this.install().catch((err) => {
					result.success = false
					result.message = err.message
				})
				if (!result.success) return reject(result)
			}

			// Création du fichier RDP
			this.rdpFile = await buildRdpFile(this.args).catch((err) => {
				result.success = false
				result.message = err.message
			})
			if (!result.success) return reject(result)
			if (this.args.debug) console.log(this.rdpFile)

			// Création des informations d’identification de domaine
			await cmd.spawn('cmdkey.exe', [
				'/generic:TERMSRV/'+this.args.address,
				'/user:'+this.args.username,
				'/pass:'+this.args.password
			]).then((message) => {
				this.onEvent && this.onEvent(message)
			}).catch((err) => {
				result.success = false
				result.message = err.message
			})
			if (!result.success) return reject(result)

			// Démarrage de la connexion RDP
		    cmd.spawn('mstsc.exe', [
				this.rdpFile,
				'/v:'+this.args.address
			], { detached: true }).then(() => {
				this.onEvent && this.onEvent('Connection closed')
			}).catch((err) => reject(err))

			// Suppression du fichier RDP & informations d’identification
			setTimeout(async () => {
				await this.deleteRdp().catch((err) => console.error(err))
				this.onEvent && this.onEvent('Connection established successfully')
				resolve()
			}, 10000)
		})
	}

	deleteRdp() {
		return new Promise(async (resolve, reject) => {
			// Suppression du fichier RDP
			try { fs.unlinkSync(this.rdpFile) } catch (err) { reject(err) }

			// Suppression des informations d’identification
			cmd.spawn('cmdkey.exe', [
				'/delete:TERMSRV/'+this.args.address
			]).then((message) => {
				this.onEvent && this.onEvent(message)
				resolve()
			}).catch((err) => reject(err))
		})
	}

	install() {
		return new Promise(async (resolve, reject) => {
			try {
				// Création du dossier d'installation si nécessaire
				if (!fs.existsSync(this.exePath)) fs.mkdirSync(this.exePath, { recursive: true })

				// Copie l'exécutable dans le dossier d'installation
				if (!fs.existsSync(this.exeFile)) {
					fs.copyFileSync(this.installerPath, this.exeFile)
				}

				// Création du fichier .vbs
				await this.createVbs()

				// Création du fichier .reg
				await this.createReg()

				// Exécution puis suppression du fichier .reg
				await cmd.runCmd('regedit /S "'+this.regFile+'"')
				fs.unlinkSync(this.regFile)

				resolve()
			} catch (err) {
				reject(err)
			}
		})
	}

	createVbs() {
		return new Promise(async (resolve, reject) => {
			let content = 'Dim WShell\n'
			content += 'Set WShell = CreateObject("WScript.Shell")\n'
			content += 'WShell.Run "'+this.exeFile+' " + Wscript.Arguments.Item(0), 0, false\n'
			content += 'Set WShell = Nothing\n'

			fs.writeFile(this.vbsFile, content, (err) => {
				if (err) return reject(err)
				resolve()
			})
		})
	}

	createReg() {
		return new Promise(async (resolve, reject) => {
			let content = 'Windows Registry Editor Version 5.00\n'
			content += '[HKEY_CLASSES_ROOT\\rdp]\n'
			content += '@="rdp:RDP Connect"\n'
			content += '"URL Protocol"=""\n'
			content += '[HKEY_CLASSES_ROOT\\rdp\\DefaultIcon]\n'
			content += '@="\\"C:\\\\Windows\\\\System32\\\\mstsc.exe\\""\n'
			content += '[HKEY_CLASSES_ROOT\\rdp\\shell]\n'
			content += '[HKEY_CLASSES_ROOT\\rdp\\shell\\open]\n'
			content += '[HKEY_CLASSES_ROOT\\rdp\\shell\\open\\command]\n'
			content += '@="wscript \\"'+this.vbsFile.replace(/\\/g, '\\\\')+'\\" \\"%1\\""'

			fs.writeFile(this.regFile, content, (err) => {
				if (err) return reject(err)
				resolve()
			})
		})
	}
}
