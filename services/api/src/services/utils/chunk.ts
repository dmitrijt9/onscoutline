export default (arr: string[], len: number) => {
    const chunks: any[] = []
    let i = 0
    const n = arr.length

    while (i < n) {
        chunks.push(arr.slice(i, (i += len)))
    }

    return chunks
}
