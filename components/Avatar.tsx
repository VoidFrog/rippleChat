import React from "react";
import { Image } from "react-native";

const Avatar: React.FC<{ uri: string }> = ({ uri }) => {
  return (
    <Image
      source={{ uri }}
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 6,
        backgroundColor: "#ccc",
      }}
    />
  );
};

export default React.memo(Avatar);
