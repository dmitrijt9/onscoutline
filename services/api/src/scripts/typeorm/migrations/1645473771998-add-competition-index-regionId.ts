import { MigrationInterface, QueryRunner } from 'typeorm'

export class addCompetitionIndexRegionId1645473771998 implements MigrationInterface {
    name = 'addCompetitionIndexRegionId1645473771998'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_000730912a4f71db95a31856dd\` ON \`competition\``)
        await queryRunner.query(`DROP INDEX \`IDX_1238846a10ffc667350ce51ceb\` ON \`competition\``)
        await queryRunner.query(
            `ALTER TABLE \`competition\` ADD \`regionId\` varchar(255) NOT NULL`,
        )
        await queryRunner.query(
            `CREATE INDEX \`competition_facr_id\` ON \`competition\` (\`regionId\`, \`facrId\`)`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`competition_facr_id\` ON \`competition\``)
        await queryRunner.query(`ALTER TABLE \`competition\` DROP COLUMN \`regionId\``)
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`IDX_1238846a10ffc667350ce51ceb\` ON \`competition\` (\`facrUuid\`)`,
        )
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`IDX_000730912a4f71db95a31856dd\` ON \`competition\` (\`facrId\`)`,
        )
    }
}
