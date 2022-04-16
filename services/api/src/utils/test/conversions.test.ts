import {
    createTestingClient,
    stopTestApplication,
    TestingClient,
} from '../../dependency/test-utils/index'
import { fromFacrDateTime } from '../conversions'

describe('Conversions util', () => {
    let testingClient: TestingClient

    beforeAll(async () => {
        testingClient = await createTestingClient()
    })

    afterAll(async () => {
        await stopTestApplication(testingClient.application)
    })

    describe('From FACR datetime format conversion util', () => {
        it.each([
            { input: 'Neděle 26. 9. 2021 13:00', expected: '2021-09-26T13:00:00' },
            { input: 'Pondělí 01. 01. 2022 01:00', expected: '2022-01-01T01:00:00' },
            { input: 'Pondělí 31. 03. 2021 03:00', expected: '2021-03-31T03:00:00' },
        ])('should convert to ISO8601 format correctly', ({ input, expected }) => {
            expect(fromFacrDateTime(input)).toBe(expected)
        })
    })
})
