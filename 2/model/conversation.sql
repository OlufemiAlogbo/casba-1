CREATE TABLE CONVERSATION (
  ID int NOT NULL,
  Message varchar(255),
  Intent varchar(255),
  Entity varchar(255),
  ToC TIMESTAMP,
  Primary Key(ID)
);

INSERT INTO CONVERSATION (ID, MESSAGE) VALUES (1, 'How can I help you?');
