export default <T>(arr: T[], len: number) => {
    const chunks: T[][] = []
    let i = 0
    const n = arr.length

    while (i < n) {
        const toPush = arr.slice(i, (i += len))
        chunks.push(toPush)
    }

    return chunks
}
