import { MigrationInterface, QueryRunner } from 'typeorm'

export class removeUniqueClubName1650185208941 implements MigrationInterface {
    name = 'removeUniqueClubName1650185208941'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_79098e276529e2f823ab6379e8\` ON \`club\``)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`IDX_79098e276529e2f823ab6379e8\` ON \`club\` (\`name\`)`,
        )
    }
}
