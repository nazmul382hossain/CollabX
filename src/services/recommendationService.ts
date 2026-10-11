import { Project, User, Paper } from '../types';

export interface ProjectRecommendation {
  project: Project;
  matchScore: number; // 0 - 99
  why: string;
}

export interface PaperRecommendation {
  paper: Paper;
  matchScore: number;
  why: string;
}

export class RecommendationService {
  /**
   * Computes match score and explanatory rationale for projects based on user profile.
   * Formula:
   * 40% Interest Area & Tags Overlap
   * 35% Skill Coverage (user skills ∩ project required skills)
   * 10% Difficulty & User Academic Level
   * 10% Behavioral Signal (saved, previous applications)
   * 5% Freshness & Deadline Proximity
   */
  static getRecommendedProjects(
    user: User, 
    allProjects: Project[], 
    savedProjectIds: string[] = [],
    joinedProjectIds: string[] = []
  ): ProjectRecommendation[] {
    const recommendations: ProjectRecommendation[] = [];

    // Filter out already joined or closed projects
    const candidateProjects = allProjects.filter(p => 
      p.status === 'active' && 
      p.filledPositions < p.totalPositions &&
      !joinedProjectIds.includes(p.id) &&
      p.supervisorId !== user.id
    );

    for (const project of candidateProjects) {
      // 1. Interest Overlap (0 - 40 pts)
      let interestScore = 0;
      const matchedInterests: string[] = [];
      const userInterestsLower = user.interests.map(i => i.toLowerCase());

      if (userInterestsLower.includes(project.areaName.toLowerCase())) {
        interestScore += 25;
        matchedInterests.push(project.areaName);
      }
      if (project.subarea && userInterestsLower.includes(project.subarea.toLowerCase())) {
        interestScore += 10;
        matchedInterests.push(project.subarea);
      }
      for (const tag of project.tags) {
        if (userInterestsLower.includes(tag.toLowerCase())) {
          interestScore += 5;
          matchedInterests.push(tag);
          break;
        }
      }
      interestScore = Math.min(40, interestScore);

      // 2. Skill Coverage (0 - 35 pts)
      let skillScore = 0;
      const matchedSkills: string[] = [];
      const userSkillsLower = user.skills.map(s => s.toLowerCase());

      if (project.requiredSkills.length > 0) {
        for (const reqSkill of project.requiredSkills) {
          if (userSkillsLower.includes(reqSkill.toLowerCase())) {
            matchedSkills.push(reqSkill);
          }
        }
        const coverageRatio = matchedSkills.length / project.requiredSkills.length;
        skillScore = Math.round(coverageRatio * 35);
      } else {
        skillScore = 20; // Default when no skills specified
      }

      // 3. Difficulty alignment (0 - 10 pts)
      let difficultyScore = 8;
      if (user.role === 'student') {
        if (project.difficulty === 'Intermediate') difficultyScore = 10;
        if (project.difficulty === 'Beginner') difficultyScore = 9;
        if (project.difficulty === 'Advanced') difficultyScore = 7;
      } else {
        if (project.difficulty === 'Advanced') difficultyScore = 10;
      }

      // 4. Behavioral signal (0 - 10 pts)
      let behavioralScore = 0;
      if (savedProjectIds.includes(project.id)) {
        behavioralScore += 10;
      } else {
        behavioralScore += 5;
      }

      // 5. Freshness / Deadline (0 - 5 pts)
      const daysUntilDeadline = Math.max(1, Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      let deadlineScore = 3;
      if (daysUntilDeadline > 7 && daysUntilDeadline < 60) {
        deadlineScore = 5;
      }

      const totalRaw = interestScore + skillScore + difficultyScore + behavioralScore + deadlineScore;
      // Cap at 99%, minimum 45% for relevant candidates
      const matchScore = Math.min(99, Math.max(48, Math.round(totalRaw)));

      // Build "Why recommended" tooltip explanation
      let why = '';
      if (matchedInterests.length > 0 && matchedSkills.length > 0) {
        why = `Matches your interest in ${matchedInterests[0]} and ${matchedSkills.length} of ${project.requiredSkills.length} required skills (${matchedSkills.slice(0, 3).join(', ')}).`;
      } else if (matchedInterests.length > 0) {
        why = `Directly aligns with your research focus in ${matchedInterests.join(' & ')}.`;
      } else if (matchedSkills.length > 0) {
        why = `Requires your verified technical skills in ${matchedSkills.join(', ')}.`;
      } else {
        why = `Trending research topic in ${project.areaName} with active supervisor openings.`;
      }

      recommendations.push({ project, matchScore, why });
    }

    // Sort descending by match score
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Recommend research papers based on user interests and skills.
   */
  static getRecommendedPapers(user: User, allPapers: Paper[]): PaperRecommendation[] {
    const userInterestsLower = user.interests.map(i => i.toLowerCase());

    return allPapers.map(paper => {
      let score = 50;
      if (userInterestsLower.includes(paper.areaName.toLowerCase())) score += 30;
      for (const kw of paper.keywords) {
        if (userInterestsLower.includes(kw.toLowerCase())) {
          score += 15;
          break;
        }
      }
      const matchScore = Math.min(98, score);
      return {
        paper,
        matchScore,
        why: `Relevant to your interest in ${paper.areaName} with ${paper.views} academic reads.`
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }
}
