import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateUqIndexes1647961286369 implements MigrationInterface {
    name = 'updateUqIndexes1647961286369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`competition_facr_id\` ON \`competition\``)
        await queryRunner.query(
            `ALTER TABLE \`club\` ADD UNIQUE INDEX \`IDX_79098e276529e2f823ab6379e8\` (\`name\`)`,
        )
        await queryRunner.query(
            `ALTER TABLE \`competition\` ADD UNIQUE INDEX \`IDX_4235f333ca8098d3693049ab82\` (\`name\`)`,
        )
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`Competition_UQ_IDX\` ON \`competition\` (\`regionId\`, \`facrId\`)`,
        )
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`Player_Fullname_UQ_IDX\` ON \`player\` (\`name\`, \`surname\`)`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`Player_Fullname_UQ_IDX\` ON \`player\``)
        await queryRunner.query(`DROP INDEX \`Competition_UQ_IDX\` ON \`competition\``)
        await queryRunner.query(
            `ALTER TABLE \`competition\` DROP INDEX \`IDX_4235f333ca8098d3693049ab82\``,
        )
        await queryRunner.query(
            `ALTER TABLE \`club\` DROP INDEX \`IDX_79098e276529e2f823ab6379e8\``,
        )
        await queryRunner.query(
            `CREATE INDEX \`competition_facr_id\` ON \`competition\` (\`regionId\`, \`facrId\`)`,
        )
    }
}
