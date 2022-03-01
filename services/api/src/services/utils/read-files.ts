import { readdirSync, readFileSync } from 'fs'

export default (dirname: string, onFileContent: (filename: string, content: string) => any) => {
    const filenames = readdirSync(dirname)
    filenames.forEach((filename) => {
        const content = readFileSync(dirname + filename, 'utf-8')
        onFileContent(filename, content)
    })
}
