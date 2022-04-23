import { MigrationInterface, QueryRunner } from 'typeorm'

export class addMatchDedupKey1650542718002 implements MigrationInterface {
    name = 'addMatchDedupKey1650542718002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`Match_Dedup_key\` ON \`match\` (\`when\`, \`homeTeamId\`, \`awayTeamId\`, \`competitionSeasonId\`)`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`Match_Dedup_key\` ON \`match\``)
    }
}
