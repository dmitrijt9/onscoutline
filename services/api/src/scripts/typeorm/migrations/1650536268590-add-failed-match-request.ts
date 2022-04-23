import { MigrationInterface, QueryRunner } from 'typeorm'

export class addFailedMatchRequest1650536268590 implements MigrationInterface {
    name = 'addFailedMatchRequest1650536268590'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`failed_new_match_request\` (\`id\` varchar(36) NOT NULL, \`status\` varchar(255) NOT NULL, \`requestJson\` longtext NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`failed_new_match_request\``)
    }
}
