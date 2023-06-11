use serde::Serialize;

#[derive(Debug, Clone)]
pub enum Error {
    Io(String),
    Type(String),
    Load(String),
    Config(String),
    Runtime(String),
    Index(String),
}

impl From<office::Error> for Error {
    fn from(value: office::Error) -> Self {
        Error::Io(value.to_string())
    }
}

impl From<tokio::task::JoinError> for Error {
    fn from(value: tokio::task::JoinError) -> Self {
        Error::Load(value.to_string())
    }
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let msg = match self {
            Self::Type(s) => format!("TypeError: {s}"),
            Self::Io(s) => format!("IoError: {s}"),
            Self::Load(s) => format!("LoadError: {s}"),
            Self::Runtime(s) => format!("RuntimeError: {s}"),
            Self::Config(s) => format!("ConfigError: {s}"),
            Self::Index(s) => format!("IndexError: {s}"),
        };
        serializer.serialize_str(&msg)
    }
}
