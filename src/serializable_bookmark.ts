import { Bookmark } from "./bookmark";

export class SerializableBookmark {
    fsPath: string;
    lineNumber: number;
    characterNumber: number;
    label?: string;
    lineText: string;
    isLineNumberChanged: boolean;
    groupName: string;
    dateAdded: string;
    dateWasAdded: boolean;

    constructor(
        fsPath: string,
        lineNumber: number,
        characterNumber: number,
        label: string | undefined,
        lineText: string,
        groupName: string,
        dateAdded: string,
        dateWasAdded: boolean
    ) {
        this.fsPath = fsPath;
        this.lineNumber = lineNumber;
        this.characterNumber = characterNumber;
        this.label = label;
        this.lineText = lineText;
        this.isLineNumberChanged = false;
        this.groupName = groupName;
        this.dateAdded = dateAdded;
        this.dateWasAdded = dateWasAdded;
    }

    public static fromBookmark(bookmark: Bookmark): SerializableBookmark {
        return new SerializableBookmark(
            bookmark.fsPath,
            bookmark.lineNumber,
            bookmark.characterNumber,
            bookmark.label,
            bookmark.lineText,
            bookmark.group.name,
            bookmark.dateAdded,
            bookmark.dateWasAdded
        );
    }
}