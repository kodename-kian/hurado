"use client";
import { UserLookupDTO } from "common/types";
// import BoxIcon from "client/components/box_icon";
// import { getPath, Path } from "client/paths";

type UserEditorProps = {
  user: UserLookupDTO;
};

export const UserEditor = ({user}: UserEditorProps) => {
  return (
    <>
      <p className="font-bold text-6xl mt-8 mb-2 text-blue-450"> 
        {user.username}
      </p>
      {/* <p className="font-sans font-bold text-xl text-gray-500">
        { user.name ? user.name : "Anonymous User" } <br></br>
        { user.school ? user.school : "No Affiliation" }
      </p> */}
    </>
  );
};
