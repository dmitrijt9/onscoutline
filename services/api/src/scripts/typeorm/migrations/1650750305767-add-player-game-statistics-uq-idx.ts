import { MigrationInterface, QueryRunner } from 'typeorm'

export class addPlayerGameStatisticsUqIdx1650750305767 implements MigrationInterface {
    name = 'addPlayerGameStatisticsUqIdx1650750305767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`PlayerGameStatistic_UQ_IDX\` ON \`player_game_statistic\` (\`statType\`, \`playerInMatchId\`, \`minute\`)`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX \`PlayerGameStatistic_UQ_IDX\` ON \`player_game_statistic\``,
        )
    }
}
