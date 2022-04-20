import { MigrationInterface, QueryRunner } from 'typeorm'

export class removeFullnameUqIx1650442434940 implements MigrationInterface {
    name = 'removeFullnameUqIx1650442434940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`Player_Fullname_UQ_IDX\` ON \`player\``)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`Player_Fullname_UQ_IDX\` ON \`player\` (\`name\`, \`surname\`)`,
        )
    }
}
