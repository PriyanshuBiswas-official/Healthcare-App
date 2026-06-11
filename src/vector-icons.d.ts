// Temporary type declarations for react-native-vector-icons families used in this project
// Prevents TS errors when the package doesn't provide its own d.ts

declare module 'react-native-vector-icons/*' {
  const content: any;
  export default content;
}
