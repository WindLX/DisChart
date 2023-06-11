use crate::utils::error::Error;
use std::sync::{Arc, Mutex};

#[derive(Debug)]
pub struct StateWrapper<T>(pub Arc<Mutex<Option<T>>>)
where
    T: Clone;

impl<T> StateWrapper<T>
where
    T: Clone,
{
    pub fn get(&self) -> Result<Option<T>, Error> {
        let lock = self.0.lock();
        match lock {
            Ok(l) => {
                let value = l.clone();
                Ok(value)
            }
            Err(e) => Err(Error::Runtime(e.to_string())),
        }
    }

    pub fn set(&self, value: T) -> Result<(), Error> {
        let lock = self.0.lock();
        match lock {
            Ok(mut l) => {
                *l = Some(value);
                Ok(())
            }
            Err(e) => Err(Error::Runtime(e.to_string())),
        }
    }

    pub fn clear(&self) -> Result<(), Error> {
        let lock = self.0.lock();
        match lock {
            Ok(mut l) => {
                *l = None;
                Ok(())
            }
            Err(e) => Err(Error::Runtime(e.to_string())),
        }
    }
}

impl<T> Default for StateWrapper<T>
where
    T: Clone,
{
    fn default() -> Self {
        StateWrapper(Arc::new(Mutex::new(None)))
    }
}
