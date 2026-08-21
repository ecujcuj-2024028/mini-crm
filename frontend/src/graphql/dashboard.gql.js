import { gql } from '@apollo/client/core';

export const DASHBOARD_SUMMARY_QUERY = gql`
  query DashboardSummary($startDate: String, $endDate: String) {
    dashboardSummary(startDate: $startDate, endDate: $endDate) {
      activeUsersCount
      totalProjects
      activeProjects
      completedProjects
      pausedProjects
      totalTasks
      pendingTasks
      completedTasks
      myProjectsCount
      myTotalTasks
      myPendingTasks
      myCompletedTasks
      projectsByStatus {
        status
        count
      }
      tasksByStatus {
        status
        count
      }
      recentProjects {
        id
        name
        description
        status
        updatedAt
        owner {
          id
          name
        }
      }
      recentTasks {
        id
        title
        status
        priority
        updatedAt
        project {
          id
          name
        }
        assignedTo {
          id
          name
        }
      }
    }
  }
`;
