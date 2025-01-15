import classNames from "classnames";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useState,
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  ReactNode,
  PropsWithChildren,
  useRef,
} from "react";
import BoxIcon from "client/components/box_icon";
import { InputChangeEvent, SelectChangeEvent, TextAreaChangeEvent } from "common/types/events";
import { destructivelyComputeSHA1, IncompleteHashesException } from "./common_editor_utils";
import styles from "./common_editor.module.css";
import { Scrollable } from "../scrollable";
import { toast } from "react-toastify";
import { CommonFileED, CommonFileLocal, EditorKind } from "./types";
import { getPath, Path } from "client/paths";

type CommonEditorPageProps = {
  isStatement: boolean;
  children: React.ReactNode;
};

export const CommonEditorPage = ({ isStatement, children }: CommonEditorPageProps) => {
  return (
    <div className={classNames(styles.main, isStatement && styles.isStatement)}>{children}</div>
  );
};

type CommonEditorTitleProps = {
  title: string;
  slug: string;
};

export const CommonEditorTitle = ({ title, slug }: CommonEditorTitleProps) => {
  return (
    <div className={classNames(styles.title, "flex flex-row justify-between mx-4")}>
      <div className={classNames("font-sans text-2xl", title ? "text-black" : "text-gray-300")}>
        {title || "Title"}
      </div>
      <div className={classNames("font-mono text-2xl", slug ? "text-gray-500" : "text-gray-300")}>
        {slug || "Slug"}
      </div>
    </div>
  );
};

export type SaveResultSuccess<T> = {
  success: true;
  value: T;
};

export type SaveResultFailure = {
  success: false;
  errors: string[];
};

export type SaveResult<T> = SaveResultSuccess<T> | SaveResultFailure;

type CommonEditorFooterProps<T> = {
  initial: T;
  object: T;
  setObject(object: T): void;
  saveObject(object: T): Promise<SaveResult<T>>;
};

export const CommonEditorFooter = <T extends {}>({
  initial,
  object,
  setObject,
  saveObject,
}: CommonEditorFooterProps<T>) => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const result = await saveObject(object);
      if (result.success) {
        setObject(result.value);
        toast("Great success!", { type: "success" });
        router.refresh();
      } else {
        toast("Errors:\n" + result.errors.join("\n"), { type: "error" });
      }
    } catch (e) {
      if (e instanceof IncompleteHashesException) {
        toast(`Try again in a few seconds. Error: ${e.message}.`, { type: "error" });
      } else {
        throw e;
      }
    } finally {
      setSaving(false);
    }
  }, [object, saveObject]);

  return (
    <div
      className={classNames(
        styles.footer,
        "flex flex-row justify-end px-4 py-2 border-t border-gray-300"
      )}
    >
      <button
        disabled={object === initial || saving}
        onClick={handleSave}
        className="py-2 px-4 rounded font-bold text-white bg-blue-300 enabled:hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-default"
      >
        Save Changes
      </button>
    </div>
  );
};

export const CommonEditorContent = ({ children }: PropsWithChildren) => {
  return <Scrollable className={styles.content}>{children}</Scrollable>;
};

export const CommonEditorDetails = ({ children }: PropsWithChildren) => {
  return <div className={classNames(styles.detailEditor, "p-4 gap-x-12 gap-y-6")}>{children}</div>;
};

type CommonEditorAddButtonProps = {
  label: string;
  onClick(): void;
  disabled?: boolean;
};

export const CommonEditorAddButton = ({ onClick, disabled, label }: CommonEditorAddButtonProps) => {
  return (
    <button onClick={onClick} disabled={disabled} className={styles.addButton}>
      <BoxIcon name="bx-plus" className="bx-xs mt-1" />
      {label}
    </button>
  );
};

type CommonEditorActionButtonProps = {
  icon: string;
  size?: "bx-xs" | "bx-sm" | "bx-md" | "bx-lg" | "bx-xl";
  onClick(): void;
} & DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

export const CommonEditorActionButton = ({
  icon,
  size,
  onClick,
  ...rest
}: CommonEditorActionButtonProps) => {
  return (
    <button {...rest} onClick={onClick} className="text-gray-300 hover:text-gray-500">
      <BoxIcon
        name={icon}
        className={classNames("bx text-gray-300 hover:text-gray-500", size ?? "bx-xs")}
      />
    </button>
  );
};

type CommonEditorActionLinkProps = {
  icon: string;
  href: string;
} & DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;

export const CommonEditorActionLink = ({ icon, href, ...rest }: CommonEditorActionLinkProps) => {
  return (
    <a href={href} {...rest} className="text-gray-300 hover:text-gray-500">
      <BoxIcon name={icon} className="bx bx-xs text-gray-300 hover:text-gray-500" />
    </a>
  );
};

type CommonEditorLabelProps = {
  label: string;
};

export const CommonEditorLabel = ({ label }: CommonEditorLabelProps) => {
  return <div className="text-lg text-gray-500">{label}</div>;
};

type CommonEditorInputProps = {
  value: string;
  onChange(event: InputChangeEvent | TextAreaChangeEvent): void;
  placeholder?: string;
  type: "text" | "textarea";
  className?: string;
};

export const CommonEditorInput = ({
  type,
  value,
  onChange,
  placeholder,
  className,
}: CommonEditorInputProps) => {
  if (type == "text") {
    return (
      <input
        className={classNames("font-mono p-2 border border-gray-300 rounded-lg", className)}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  } else {
    return (
      <textarea
        className={classNames("font-mono p-2 border border-gray-300 rounded-lg h-24", className)}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  }
};

type CommonEditorInputSubtleProps = {
  value: string;
  onChange(event: InputChangeEvent): void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export const CommonEditorInputSubtle = ({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: CommonEditorInputSubtleProps) => {
  return (
    <input
      type="text"
      className={classNames(
        "outline-none border-b border-transparent focus:border-b-gray-300",
        disabled ? "text-gray-300 line-through" : "text-gray-500",
        className
      )}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};

type CommonEditorSelectProps = {
  value: string;
  onChange(event: SelectChangeEvent): void;
  className?: string;
  children: ReactNode;
};

export const CommonEditorSelect = ({
  value,
  onChange,
  className,
  children,
}: CommonEditorSelectProps) => {
  return (
    <select
      className={classNames(className, "font-mono p-2 border border-gray-300 rounded-lg")}
      value={value}
      onChange={onChange}
    >
      {children}
    </select>
  );
};

type CommonEditorTableHeaderProps = {
  text?: string;
  children?: React.ReactNode;
};

export const CommonEditorTableHeader = ({ text, children }: CommonEditorTableHeaderProps) => {
  return <div className="text-gray-500 font-roboto font-medium">{text ?? children}</div>;
};

type CommonEditorTableCellProps = {
  children: React.ReactNode;
  deleted?: boolean;
};

export const CommonEditorTableCell = ({ deleted, children }: CommonEditorTableCellProps) => {
  return (
    <div className={classNames("font-roboto font-light text-gray-500", deleted && "line-through")}>
      {children}
    </div>
  );
};


type CommonEditorFileInputProps = {
  file: CommonFileED | null;
  onFileChange(file: CommonFileED | null, filename: string): void;
  filename: string | null;
  onFilenameChange(filename: string): void;
  disabled: boolean;
};

export const CommonEditorFileInput = (props: CommonEditorFileInputProps) => {
  const { filename, file, onFilenameChange, onFileChange, disabled } = props;
  const pickerRef = useRef<HTMLInputElement>(null);

  const onPickerClick = useCallback(() => {
    if (pickerRef.current != null) {
      pickerRef.current.click();
    }
  }, []);

  const onFileSelect = useCallback(() => {
    if (pickerRef.current?.files != null && pickerRef.current.files?.length > 0) {
      const curr = pickerRef.current.files[0];
      const newFile: CommonFileLocal = {
        kind: EditorKind.Local,
        file: curr,
        hash: "",
      };
      destructivelyComputeSHA1(newFile);
      onFileChange(newFile, curr.name);
    }
  }, [file, filename, onFileChange]);

  const onFileRemove = useCallback(() => {
    onFileChange(null, "");
  }, [file, filename, onFileChange]);

  const onNameChange = useCallback(
    (event: InputChangeEvent) => {
      onFilenameChange(event.target.value);
    },
    [onFilenameChange]
  );

  if (file == null) {
    return (
      <>
        <button
          type="button"
          onClick={onPickerClick}
          disabled={disabled}
          className={classNames(disabled ? "text-gray-300 hover:cursor-default" : "text-gray-500")}
        >
          Select file...
        </button>
        <input type="file" className="hidden" onChange={onFileSelect} ref={pickerRef} />
      </>
    );
  } else {
    const downloadUrl = getPath({
      kind: Path.AdminFileDownload,
      hash: file.hash,
      filename: filename ?? 'unnamed_file',
    });
    return (
      <div className="flex flex-row gap-2">
        <CommonEditorInputSubtle
          className="flex-auto"
          value={filename ?? ""}
          onChange={onNameChange}
          disabled={disabled}
        />
        {!disabled && (
          <>
            {file.kind === EditorKind.Saved
              ? <CommonEditorActionLink icon="bx-download" href={downloadUrl} tabIndex={-1} target="_blank" />
              : null}
            <CommonEditorActionButton icon="bx-x" onClick={onFileRemove} tabIndex={-1} />
          </>
        )}
      </div>
    );
  }
};
