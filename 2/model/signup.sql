CREATE TABLE SIGNUP (
  ID int NOT NULL,
  bvn bigint,
  lastName varchar(255),
  firstName varchar(255),
  phoneNumber varchar(255),
  dateOfBirth varchar(255),
  DoC DATE,
  Primary Key(ID)
);

INSERT INTO SIGNUP (ID, BVN) VALUES (1, 12345678901);
