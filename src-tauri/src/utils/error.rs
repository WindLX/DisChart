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

impl From<std::io::Error> for Error {
    fn from(value: std::io::Error) -> Self {
        Error::Io(value.to_string())
    }
}

impl From<office::Error> for Error {
    fn from(value: office::Error) -> Self {
        Error::Io(value.to_string())
    }
}

impl From<core::num::ParseIntError> for Error {
    fn from(value: core::num::ParseIntError) -> Self {
        Error::Type(value.to_string())
    }
}

impl From<tokio::task::JoinError> for Error {
    fn from(value: tokio::task::JoinError) -> Self {
        Error::Load(value.to_string())
    }
}

impl From<serde_yaml::Error> for Error {
    fn from(value: serde_yaml::Error) -> Self {
        Error::Load(value.to_string())
    }
}

impl<'a, T> From<std::sync::PoisonError<std::sync::MutexGuard<'a, T>>> for Error {
    fn from(value: std::sync::PoisonError<std::sync::MutexGuard<'a, T>>) -> Self {
        Error::Runtime(value.to_string())
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
