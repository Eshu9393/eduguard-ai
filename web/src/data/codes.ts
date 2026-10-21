import raw from "./codeTables.json";

export type Option = { code: number; label: string };

const tables = raw as Record<string, Option[]>;

export const MARITAL_STATUS = tables.MARITAL_STATUS;
export const APPLICATION_MODE = tables.APPLICATION_MODE;
export const COURSE = tables.COURSE;
export const PREVIOUS_QUALIFICATION = tables.PREVIOUS_QUALIFICATION;
export const NATIONALITY = tables.NATIONALITY;
export const MOTHER_QUALIFICATION = tables.MOTHER_QUALIFICATION;
export const FATHER_QUALIFICATION = tables.FATHER_QUALIFICATION;
export const MOTHER_OCCUPATION = tables.MOTHER_OCCUPATION;
export const FATHER_OCCUPATION = tables.FATHER_OCCUPATION;
export const GENDER = tables.GENDER;