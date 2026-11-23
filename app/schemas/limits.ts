import * as yup from 'yup';

/**
 * Shared size limits for request bodies — keeps a single request from writing a 400 KB DynamoDB
 * item or burning Lambda time on a giant array. Generous enough for every real client payload.
 */
export const MAX_NAME = 50;
export const MAX_ID = 100;
export const MAX_SLUGS = 200;

/** An id / slug / opportunity reference. */
export const idString = () => yup.string().max(MAX_ID, `must be at most ${MAX_ID} characters`);

/** A person's name or nickname. */
export const nameString = () => yup.string().max(MAX_NAME, `name must be at most ${MAX_NAME} characters`);

/** List of slugs/ids (interests, tags, skills). */
export const slugArray = () => yup.array(idString().required()).max(MAX_SLUGS, `at most ${MAX_SLUGS} items`);

/** YYYY-M-D (the app doesn't zero-pad the day) optionally followed by a time. */
export const dateOfBirthString = () =>
  yup.string().max(30).matches(/^\d{4}-\d{1,2}-\d{1,2}([T ][0-9:.]+Z?)?$/, 'dateOfBirth must be a date (YYYY-MM-DD)');

export const emailString = () => yup.string().trim().email('Invalid email').max(254, 'Email is too long');
export const postCodeString = () => yup.string().trim().max(10, 'postCode is too long');
