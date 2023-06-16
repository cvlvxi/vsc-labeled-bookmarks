import { DecorationFactory } from "./decoration_factory";
import { TextEditorDecorationType, Uri } from "vscode";
import { SerializableBookmark } from "./serializable_bookmark";
import { Group } from "./group";

export class Bookmark {
    public fsPath: string;
    public lineNumber: number;
    public characterNumber: number;
    public label?: string;
    public lineText: string;
    public failedJump: boolean;
    public isLineNumberChanged: boolean;
    public group: Group;
    public decorationFactory: DecorationFactory;
    public dateAdded: string;
    public dateWasAdded: boolean;

    private ownDecoration: TextEditorDecorationType | null;
    private bookmarkDecorationUpdatedHandler: (bookmark: Bookmark) => void;
    private decorationRemovedHandler: (decoration: TextEditorDecorationType) => void;

    constructor(
        fsPath: string,
        lineNumber: number,
        characterNumber: number,
        label: string | undefined,
        lineText: string,
        group: Group,
        decorationFactory: DecorationFactory,
        dateAdded: string = "",
        dateWasAdded: boolean = false,
    ) {
        this.fsPath = fsPath;
        this.lineNumber = lineNumber;
        this.characterNumber = characterNumber;
        this.dateAdded = (dateAdded === "") ? new Date().toISOString() : dateAdded;
        this.label = (!dateWasAdded) ? this.dateAdded : "" + (label? " : " + label : "");
        this.dateWasAdded = true;
        this.lineText = lineText;
        this.failedJump = false;
        this.isLineNumberChanged = false;
        this.group = group;
        this.decorationFactory = decorationFactory;
        this.ownDecoration = null;
        this.bookmarkDecorationUpdatedHandler = (bookmark: Bookmark) => { return; };
        this.decorationRemovedHandler = (decoration: TextEditorDecorationType) => { return; };
    }

    public static fromSerializableBookMark(
        serialized: SerializableBookmark,
        groupGetter: (groupName: string) => Group,
        decorationFactory: DecorationFactory
    ): Bookmark {
        return new Bookmark(
            serialized.fsPath,
            serialized.lineNumber,
            serialized.characterNumber,
            serialized.label,
            serialized.lineText,
            groupGetter(serialized.groupName),
            decorationFactory,
            serialized.dateAdded,
            serialized.dateWasAdded,
        );
    }

    public static sortByLocation(a: Bookmark, b: Bookmark): number {
        return a.fsPath.localeCompare(b.fsPath)
            || (a.lineNumber - b.lineNumber)
            || (a.characterNumber - b.characterNumber);
    }

    public static sortByDateAdded(a: Bookmark, b: Bookmark): number {
        return a.dateAdded.localeCompare(b.dateAdded);
    }

    public resetIsLineNumberChangedFlag() {
        this.isLineNumberChanged = false;
    }

    public setLineAndCharacterNumbers(lineNumber: number, characterNumber: number) {
        this.characterNumber = characterNumber;

        if (lineNumber === this.lineNumber) {
            return;
        }

        this.lineNumber = lineNumber;
        this.isLineNumberChanged = true;
    }

    public getDecoration(): TextEditorDecorationType | null {
        if (this.group.isActive && this.group.isVisible) {
            return this.ownDecoration || this.group.getActiveDecoration();
        } else {
            return this.group.getActiveDecoration();
        }
    }

    public onBookmarkDecorationUpdated(fn: (bookmark: Bookmark) => void) {
        this.bookmarkDecorationUpdatedHandler = fn;
    }

    public onDecorationRemoved(fn: (decoration: TextEditorDecorationType) => void) {
        this.decorationRemovedHandler = fn;
    }

    public async initDecoration() {
        if (typeof this.label === "undefined") {
            return;
        }

        let previousDecoration = this.ownDecoration;
        let tempSvg: Uri;

        [this.ownDecoration, tempSvg] = await this.decorationFactory.create(
            this.group.shape,
            this.group.color,
            this.group.iconText,
            this.label
        );

        if (previousDecoration !== null) {
            this.decorationRemovedHandler(previousDecoration);
        }

        this.bookmarkDecorationUpdatedHandler(this);
    }

    public switchDecoration() {
        if (this.ownDecoration !== null) {
            this.decorationRemovedHandler(this.ownDecoration);
        }

        this.bookmarkDecorationUpdatedHandler(this);
    }
}