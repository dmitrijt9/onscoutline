import { StatType } from '../../entities/PlayerGameStatistic'

export class StatisticsService {
    /**
     * Converts FACR goal types to an app's enum StatType value
     *
     * All unknown goal types will be tracked as regular goals
     * @param facrGoalType Goal types from FACR database, e.g. Vlastni, Branka etc.
     * @returns
     */
    facrGoalTypeToStatType(facrGoalType: string): StatType {
        const goalTypesMap: Map<string, StatType> = new Map([
            ['Pokutový kop', StatType.PenaltyGoal],
            ['Vlastní', StatType.OwnGoal],
            ['Branka', StatType.RegularGoal],
        ])

        return goalTypesMap.get(facrGoalType) ?? StatType.RegularGoal
    }
}
