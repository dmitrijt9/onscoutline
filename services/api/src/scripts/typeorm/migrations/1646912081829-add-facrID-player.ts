import { MigrationInterface, QueryRunner } from 'typeorm'

export class addFacrIDPlayer1646912081829 implements MigrationInterface {
    name = 'addFacrIDPlayer1646912081829'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`player\` ADD \`facrId\` varchar(255) NOT NULL`)
        await queryRunner.query(
            `ALTER TABLE \`player\` ADD UNIQUE INDEX \`IDX_696b4ab31f39377e3d62274f25\` (\`facrId\`)`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`player\` DROP INDEX \`IDX_696b4ab31f39377e3d62274f25\``,
        )
        await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`facrId\``)
    }
}
