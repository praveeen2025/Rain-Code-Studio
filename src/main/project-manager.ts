/**
 * SnapDev AI - Project Manager
 * Handles project loading, demo workspace initialization,
 * metadata extraction, and recent workspace persistence.
 */

import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';
import { Project, ProjectMetadata } from '../shared/types';
import { filesystemManager } from './filesystem';

export class ProjectManager {
  private activeProject: Project | null = null;
  private recentProjects: Project[] = [];

  public getActiveProject(): Project | null {
    return this.activeProject;
  }

  public getRecentProjects(): Project[] {
    return [...this.recentProjects];
  }

  /**
   * Inspect project directory to detect languages and configuration files.
   */
  private async detectMetadata(projectPath: string): Promise<ProjectMetadata> {
    const detectedConfigs: string[] = [];
    let language: string | undefined = undefined;
    let framework: string | undefined = undefined;

    const checkFile = async (name: string): Promise<boolean> => {
      try {
        await fs.access(path.join(projectPath, name));
        return true;
      } catch {
        return false;
      }
    };

    if (await checkFile('package.json')) {
      detectedConfigs.push('package.json');
      language = 'TypeScript / JavaScript';
      try {
        const pkgContent = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
        const pkg = JSON.parse(pkgContent);
        if (pkg.dependencies?.react || pkg.devDependencies?.react) {
          framework = 'React';
        } else if (pkg.dependencies?.next) {
          framework = 'Next.js';
        } else if (pkg.dependencies?.vue) {
          framework = 'Vue';
        }
      } catch {
        // parse error ignored
      }
    }

    if (await checkFile('tsconfig.json')) {
      detectedConfigs.push('tsconfig.json');
      language = 'TypeScript';
    }

    if (await checkFile('requirements.txt') || await checkFile('pyproject.toml') || await checkFile('setup.py')) {
      detectedConfigs.push('python-config');
      language = language ? `${language} & Python` : 'Python';
    }

    if (await checkFile('Cargo.toml')) {
      detectedConfigs.push('Cargo.toml');
      language = 'Rust';
    }

    const totalFiles = filesystemManager.countProjectFiles(projectPath);

    return {
      language: language || 'General Codebase',
      framework,
      totalFiles,
      detectedConfigs
    };
  }

  /**
   * Load any folder as an active project.
   */
  public async loadProject(folderPath: string, isDemo = false): Promise<Project> {
    const isValid = await filesystemManager.validateDirectory(folderPath);
    if (!isValid) {
      throw new Error(`Invalid project path or directory does not exist: ${folderPath}`);
    }

    const name = path.basename(folderPath);
    const metadata = await this.detectMetadata(folderPath);

    const project: Project = {
      id: Buffer.from(folderPath).toString('base64').substring(0, 16),
      name,
      path: folderPath,
      isDemo,
      createdAt: new Date().toISOString(),
      lastOpened: new Date().toISOString(),
      fileCount: metadata.totalFiles,
      metadata
    };

    this.activeProject = project;

    // Update recent projects
    this.recentProjects = [
      project,
      ...this.recentProjects.filter((p) => p.path !== project.path)
    ].slice(0, 10);

    return project;
  }

  /**
   * Locate and load the bundled demo project.
   */
  public async loadDemoProject(): Promise<Project> {
    let demoPath: string;
    if (app.isPackaged) {
      demoPath = path.join(process.resourcesPath, 'demo-project');
    } else {
      demoPath = path.join(app.getAppPath(), 'demo-project');
    }

    return this.loadProject(demoPath, true);
  }
}

export const projectManager = new ProjectManager();
