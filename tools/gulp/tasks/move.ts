/**
 * @see https://github.com/nestjs/nest/blob/master/tools/gulp/tasks/move.ts
 */

import { dest, src, task } from 'gulp';
import { join } from 'path';
import { samplePath } from '../config';
import { containsPackageJson, getDirs } from '../util/task-helpers';

function move() {
  const samplesDirs = getDirs(samplePath);
  const distFiles = src(['node_modules/@ucsjs/**/*']);

  const flattenedSampleDirs: string[] = [];

  for (const sampleDir of samplesDirs) {
    if (containsPackageJson(sampleDir)) {
      flattenedSampleDirs.push(sampleDir);
    } else {
      flattenedSampleDirs.push(...getDirs(sampleDir));
    }
  }

  return flattenedSampleDirs.reduce(
    (distFile, dir) => distFile.pipe(dest(join(dir, '/node_modules/@ucsjs'))),
    distFiles,
  );
}

task('move', move);