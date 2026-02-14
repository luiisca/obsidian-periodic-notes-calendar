import { join, modifyFile, trim } from "@/io";
import { settingsStore } from "@/settings/store";
import { createConfirmationDialog } from "@/ui/modals/confirmation";
import emojiRegex from "emoji-regex";
import { normalizePath, Notice, TFile } from "obsidian";
import { get } from "svelte/store";
import MigrateTitle from './MigrateTitle.svelte'
import { genNoticeFragment } from "@/ui/utils";

export const handlePNBackup = async () => {
  const paths: string[] = Object.keys(get(settingsStore).filepaths);
  if (paths.length === 0) {
    new Notice("No periodic notes to backup.");
    return;
  }

  const timestamp = window.moment().format("YYYYMMDDHHmmss");
  const backupFolder = `periodic-notes-BACKUP-${timestamp}`;

  try {
    if (!window.app.vault.getAbstractFileByPath(backupFolder)) {
      await window.app.vault.createFolder(backupFolder);
    }
  } catch (e) {
    console.error("Failed to create backup folder", e);
    new Notice("Failed to create backup folder. It might already exist.");
    return;
  }

  let backedUpCount = 0;
  new Notice(genNoticeFragment([
    ['Starting backup of '],
    [`${paths.length} `, 'u-pop'],
    ['files...']
  ]))

  for (const path of paths) {
    const file = window.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      const destPath = normalizePath(join(backupFolder, path));
      const destFolder = destPath.substring(0, destPath.lastIndexOf("/"));

      // Recursive folder creation
      const folders = destFolder.split("/");
      let currentPath = "";
      for (const folder of folders) {
        currentPath = currentPath ? `${currentPath}/${folder}` : folder;
        if (!window.app.vault.getAbstractFileByPath(currentPath)) {
          try {
            await window.app.vault.createFolder(currentPath);
          } catch (e) {
            // Folder might have been created by another iteration or exists
          }
        }
      }

      try {
        await window.app.vault.copy(file, destPath);
        backedUpCount++;
      } catch (e) {
        console.error(`Failed to copy file ${path}`, e);
      }
    }
  }

  new Notice(genNoticeFragment([
    ['Backup complete! '],
    [`${backedUpCount} `, 'u-pop'],
    ['files copied to '],
    [`${backupFolder}`, 'u-pop'],
  ]));
};

export const handlePNMigrate = async () => {
  const paths = Object.keys(get(settingsStore).filepaths);

  const migrate = async () => {
    if (paths.length === 0) {
      new Notice("No periodic notes to migrate.");
      return;
    }

    const lastUsedPrefixes = get(settingsStore).lastUsedStickerPrefixes.map((p) =>
      trim(p),
    );
    const newPrefix = trim(get(settingsStore).stickerPrefix);

    let migratedCount = 0;
    new Notice(genNoticeFragment([
      ['Starting migration of stickers in '],
      [`${paths.length} `, 'u-pop'],
      ['files...']
    ]));

    for (const path of paths) {
      const file = window.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) continue;

      const tags = window.app.metadataCache.getFileCache(file)?.tags;
      if (!tags) continue;

      let stickerToMigrate = null;

      // Find sticker using any of the lastUsedPrefixes
      for (const tagObj of tags) {
        // tagObj.tag includes the '#'
        const tagWithoutHash = tagObj.tag.slice(1);

        for (const prefix of lastUsedPrefixes) {
          if (tagWithoutHash.startsWith(prefix)) {
            const emojiCandidate = tagWithoutHash.slice(prefix.length);
            const match = emojiCandidate.match(emojiRegex());

            if (
              match?.[0] === emojiCandidate &&
              match?.[0].length === emojiCandidate.length
            ) {
              stickerToMigrate = {
                emoji: emojiCandidate,
                startOffset: tagObj.position.start.offset,
                endOffset: tagObj.position.end.offset,
              };
              break;
            }
          }
        }
        if (stickerToMigrate) break;
      }

      if (stickerToMigrate) {
        const content = await window.app.vault.read(file);
        const stickerString = `${newPrefix}${stickerToMigrate.emoji}`;

        const bef = content.slice(0, stickerToMigrate.startOffset);
        const aft = content.slice(stickerToMigrate.endOffset);
        const updatedContent = `${bef}#${stickerString}${aft}`;

        await modifyFile(file, updatedContent);
        settingsStore.update((s) => {
          s.lastUsedStickerPrefixes = [newPrefix];
          return s;
        });

        migratedCount++;
      }
    }

    new Notice(genNoticeFragment([
      ['Migration complete! '],
      [`${migratedCount} `, 'u-pop'],
      ['files updated.'],
    ]));
  }

  const shouldConfirmBeforeStickerMigrate = get(settingsStore).shouldConfirmBeforeStickerMigrate;
  if (shouldConfirmBeforeStickerMigrate) {
    createConfirmationDialog({
      title: {
        Component: MigrateTitle,
        props: {
          filepathsLength: paths.length
        }
      },
      text: "",
      cta: "Migrate",
      onAccept: async (dontAskAgain) => {
        migrate().catch(console.error);

        if (dontAskAgain) {
          settingsStore.update((settings) => ({
            ...settings,
            shouldConfirmBeforeStickerMigrate: false
          }));
        }
      }
    });
  } else {
    migrate().catch(console.error)
  }
};
